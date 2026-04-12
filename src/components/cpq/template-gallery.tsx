'use client';

import { PRICING_TEMPLATES, type PricingTemplate } from './pricing-template-data';

interface TemplateGalleryProps {
  onSelectTemplate: (template: PricingTemplate) => void;
  onStartFromScratch: () => void;
}

export function TemplateGallery({ onSelectTemplate, onStartFromScratch }: TemplateGalleryProps) {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Welcome to your Product Catalog</h2>
        <p className="mt-2 text-gray-500">Start with a template or build from scratch.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRICING_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="rounded-lg border-2 border-gray-200 p-6 text-left hover:border-blue-400 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Use ${template.title} template`}
          >
            <div className="text-3xl mb-3" aria-hidden="true">{template.icon}</div>
            <h3 className="font-semibold text-base">{template.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600">
              Use Template &rarr;
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onStartFromScratch}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Start from scratch &rarr;
        </button>
      </div>
    </div>
  );
}
