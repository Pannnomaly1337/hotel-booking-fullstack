export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-inset px-6 pb-9 pt-14 text-dim md:px-18">
      <div className="flex flex-wrap justify-between gap-8 border-b border-border pb-8">
        <div className="max-w-xs">
          <div className="mb-3.5 font-display text-xl font-bold tracking-wide text-fg">
            AURELIA
          </div>
          <p className="text-sm leading-relaxed">
            A small hotel built around rest. Bangkok, Thailand.
          </p>
        </div>
        <div className="flex flex-wrap gap-16">
          <div>
            <div className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-brand-light">
              Visit
            </div>
            <div className="text-sm leading-loose">
              Rooms
              <br />
              Our Story
              <br />
              Experiences
            </div>
          </div>
          <div>
            <div className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-brand-light">
              Reach us
            </div>
            <div className="text-sm leading-loose">
              +66 2 000 0000
              <br />
              stay@aurelia.co
              <br />
              @aureliahotel
            </div>
          </div>
        </div>
      </div>
      <div className="pt-6 text-xs text-faint">
        © 2026 Aurelia Hotel · All rights reserved
      </div>
    </footer>
  );
}
