import { useNavigate } from "react-router-dom";
import { Icon } from "../../lib/icons";
import { useStorage } from "../../hooks/useStorage";
import type { Template } from "../../types";

export default function TemplatesPage() {
  const { data } = useStorage();
  const nav = useNavigate();

  const templates = data.templates;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Templates
          </h1>
          <p className="text-sm text-muted mt-1">
            Ready-to-use print layouts for common jobs.
          </p>
        </div>
        <button
          onClick={() => nav("/print")}
          className="btn btn-primary"
        >
          <Icon name="print" /> Open Print Studio
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="card p-10 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: "color-mix(in srgb, var(--brand) 10%, transparent)",
              color: "var(--brand)",
            }}
          >
            <Icon name="layers" size="lg" />
          </div>
          <p className="text-sm text-muted">No templates available.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl: Template) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onUse={() => nav("/print")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: () => void;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-soft transition-snappy group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
        style={{ background: "var(--brand)" }}
      >
        <Icon name={template.icon} size="lg" />
      </div>

      <div>
        <h3 className="font-semibold">{template.name}</h3>
        <p className="text-sm text-muted mt-1">{template.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="chip">{template.paper}</span>
        <span className="chip capitalize">{template.orientation}</span>
        <span className="chip capitalize">{template.layout}</span>
        {template.rows && template.cols && (
          <span className="chip">
            {template.rows}×{template.cols}
          </span>
        )}
      </div>

      <button onClick={onUse} className="btn btn-primary w-full mt-1">
        <Icon name="print" /> Use Template
      </button>
    </div>
  );
}
