import ConstellationView from "./ConstellationView";

export default function ConstellationPage() {
  return (
    <section className="stack">
      <div className="stack">
        <p className="eyebrow">Constellation</p>
        <h1>Mind map</h1>
        <p className="lede">
          Notes and categories appear as a graph. The first version uses a simple generated layout; later versions can add drag-save, filters and manual relationship editing.
        </p>
      </div>
      <ConstellationView />
    </section>
  );
}
