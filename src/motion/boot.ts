// Bramka pierwszej klatki. Inline skrypt w <head> oznacza <html data-motion-boot="pending"> zanim
// cokolwiek się namaluje i uzbraja deadline. Właściciele (od P0: fonty; od P1: intro rozdziałów)
// rejestrują rollback i oddają bramkę, gdy ich intro gra. Kto nie zdąży, zostaje odkryty w spoczynku.
// Marker nigdy nie jest w HTML z serwera: bez JS nie ma bramki, strona jest czytelna od razu.

/** ms od pierwszego ukrycia do przymusowego odkrycia. */
export const BOOT_DEADLINE = 2000;

export const BOOT_SCRIPT = `(function(){try{
var d=document.documentElement;
if(matchMedia('(prefers-reduced-motion: reduce)').matches||d.getAttribute('data-motion')==='reduced')return;
var b=window.__otBoot={owners:{},done:{},expired:false,started:performance.now()};
b.timer=setTimeout(function(){
b.expired=true;var hit=false;
for(var k in b.owners){hit=true;try{b.owners[k]()}catch(e){}}
b.owners={};
d.setAttribute('data-motion-boot',hit?'recovered':'done');
},${BOOT_DEADLINE});
d.setAttribute('data-motion-boot','pending');
}catch(e){}})();`;

type Boot = {
  owners: Record<string, () => void>;
  done: Record<string, true>;
  expired: boolean;
  started: number;
  timer?: number;
};

const boot = (): Boot | undefined => (window as unknown as { __otBoot?: Boot }).__otBoot;

/** Czy bramka jeszcze trzyma (JS zdążył przed deadline'em). */
export const bootPending = (): boolean => {
  const b = boot();
  return !!b && !b.expired;
};

/** Rejestruje rollback właściciela, póki deadline go obejmuje. */
export function armRecovery(owner: string, rollback: () => void): void {
  const b = boot();
  if (!b || b.expired || b.done[owner]) return;
  b.owners[owner] = rollback;
}

/** Właściciel gra albo ma już stan spoczynku: deadline go nie dotyczy. */
export function handOff(owner: string): void {
  const b = boot();
  if (!b) return;
  delete b.owners[owner];
  b.done[owner] = true;
  if (Object.keys(b.owners).length === 0 && !b.expired) {
    // Wszyscy właściciele oddani: bramka puszcza, zanim wybije deadline.
    clearTimeout(b.timer);
    b.expired = true;
    document.documentElement.setAttribute("data-motion-boot", "done");
  }
}

/** Setup jest zdejmowany; jego rollback jest nieaktualny. */
export function disarm(owner: string): void {
  const b = boot();
  if (b) delete b.owners[owner];
}

/** Resolves gdy fonty gotowe albo po `ms`, co pierwsze. Wyścig nie anuluje ładowania. */
export function fontsReady(ms: number): Promise<void> {
  const ready = document.fonts?.ready.then(() => undefined) ?? Promise.resolve();
  return Promise.race([ready, new Promise<void>((r) => setTimeout(r, ms))]);
}
