'use client';

import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';

interface BundleComponent {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  required: boolean;
  selected: boolean;
  groupName: string;
  groupType: 'checkbox' | 'radio';
  minQuantity?: number;
  maxQuantity?: number;
}

interface BundleBuilderProps {
  bundleName: string;
  components: BundleComponent[];
  discountPercent: number;
  onChange: (components: BundleComponent[]) => void;
  onDiscountChange: (percent: number) => void;
  onSave: () => void;
}

export function BundleBuilder({
  bundleName,
  components,
  discountPercent,
  onChange,
  onDiscountChange,
  onSave,
}: BundleBuilderProps) {
  const groups = useMemo(() => {
    const map = new Map<string, BundleComponent[]>();
    for (const c of components) {
      const list = map.get(c.groupName) ?? [];
      list.push(c);
      map.set(c.groupName, list);
    }
    return map;
  }, [components]);

  const selectedComponents = components.filter((c) => c.selected);
  const individualTotal = new Decimal(
    selectedComponents.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0)
  );
  const discount = individualTotal.times(discountPercent).dividedBy(100);
  const bundlePrice = individualTotal.minus(discount);
  const savingsPercent = individualTotal.gt(0)
    ? discount.dividedBy(individualTotal).times(100).toDecimalPlaces(0).toString()
    : '0';

  const toggleComponent = (id: string) => {
    onChange(
      components.map((c) => {
        if (c.id === id && !c.required) {
          if (c.groupType === 'radio') {
            // Deselect other items in same radio group, select this one
            const group = c.groupName;
            return { ...c, selected: true };
          }
          return { ...c, selected: !c.selected };
        }
        if (c.groupType === 'radio' && c.groupName === components.find((x) => x.id === id)?.groupName && c.id !== id) {
          return { ...c, selected: false };
        }
        return c;
      })
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    onChange(
      components.map((c) =>
        c.id === id ? { ...c, quantity: Math.max(c.minQuantity ?? 1, Math.min(quantity, c.maxQuantity ?? 999)) } : c
      )
    );
  };

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Left panel: Component tree */}
      <div className="col-span-3">
        <h3 className="font-semibold mb-4">Bundle Components</h3>

        {Array.from(groups).map(([groupName, items]) => {
          const selectedInGroup = items.filter((i) => i.selected).length;
          const groupType = items[0]?.groupType ?? 'checkbox';

          return (
            <div key={groupName} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{groupName}</h4>
                {groupType === 'radio' && (
                  <span className="text-xs text-gray-400">Pick one</span>
                )}
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded border p-3 ${
                      item.selected ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.required ? (
                        <span className="text-gray-400 text-sm" title="Required" aria-label="Required component">🔒</span>
                      ) : groupType === 'radio' ? (
                        <input
                          type="radio"
                          name={groupName}
                          checked={item.selected}
                          onChange={() => toggleComponent(item.id)}
                          aria-label={`Select ${item.productName}`}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleComponent(item.id)}
                          aria-label={`Include ${item.productName}`}
                        />
                      )}
                      <div>
                        <span className="text-sm font-medium">{item.productName}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ${item.unitPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {item.selected && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Qty:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 rounded border px-2 py-1 text-sm text-center"
                          min={item.minQuantity ?? 1}
                          max={item.maxQuantity ?? 999}
                          aria-label={`${item.productName} quantity`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel: Pricing summary */}
      <div className="col-span-2">
        <div className="sticky top-6 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Pricing Summary</h3>

          {selectedComponents.length === 0 ? (
            <p className="text-sm text-gray-400">Select components to see pricing.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {selectedComponents.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {c.productName} {c.quantity > 1 && `×${c.quantity}`}
                    </span>
                    <span>${(c.unitPrice * c.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Individual total</span>
                  <span className="line-through">${individualTotal.toDecimalPlaces(2).toString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Bundle discount</span>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-16 rounded border px-2 py-1 text-sm text-center"
                      min={0}
                      max={100}
                      step={1}
                      aria-label="Bundle discount percentage"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                  <span className="text-sm text-red-500">-${discount.toDecimalPlaces(2).toString()}</span>
                </div>

                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Bundle Price</span>
                  <span>${bundlePrice.toDecimalPlaces(2).toString()}</span>
                </div>

                {discount.gt(0) && (
                  <div className="rounded bg-green-50 border border-green-200 p-2 text-center">
                    <span className="text-sm font-medium text-green-700">
                      Save ${discount.toDecimalPlaces(2).toString()} ({savingsPercent}% off)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onSave}
                className="mt-4 w-full rounded bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
              >
                Save Bundle
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
