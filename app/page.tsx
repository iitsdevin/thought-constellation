import ThoughtCapture from "@/components/ThoughtCapture";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="stack">
        <p className="eyebrow">Private knowledge graph</p>
        <h1>Capture first. Connect later.</h1>
        <p className="lede">
          A fast thought log that saves rough ideas, enriches them with context, and gradually connects them into categories,
          themes and a visual constellation.
        </p>
        <div className="grid two">
          <div className="card flat stack">
            <h3>1. Capture</h3>
            <p>Open the app, type the thought, and save it before the thread disappears.</p>
          </div>
          <div className="card flat stack">
            <h3>2. Enrich</h3>
            <p>The API adds title, context, themes, tags, questions and possible categories.</p>
          </div>
          <div className="card flat stack">
            <h3>3. Connect</h3>
            <p>Embeddings find related notes and begin forming a knowledge graph.</p>
          </div>
          <div className="card flat stack">
            <h3>4. Synthesis</h3>
            <p>Categories become living synthesis pages that gather connected thinking.</p>
          </div>
        </div>
      </div>
      <ThoughtCapture />
    </section>
  );
}
