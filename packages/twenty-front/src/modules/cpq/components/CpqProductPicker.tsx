import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from 'react';
import { styled } from '@linaria/react';

import {
  formatListPrice,
  type CatalogEntry,
} from '@/cpq/constants/cpq-phenotips-catalog';

type CpqProductPickerProps = {
  products: CatalogEntry[];
  value: CatalogEntry | null;
  onChange: (product: CatalogEntry) => void;
  placeholder?: string;
};

const StyledPickerContainer = styled.div`
  position: relative;
  width: 260px;
`;

const StyledPickerInput = styled.input`
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }
`;

const StyledDropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: var(--twentybackground-color-secondary);
  border: 1px solid var(--twentyborder-color);
  border-radius: 6px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StyledDropdownItem = styled.li<{ highlighted: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--twentyfont-color-primary);
  background: ${({ highlighted }) =>
    highlighted ? 'var(--twentycolor-blue-light, #eff6ff)' : 'transparent'};

  &:hover {
    background: var(--twentycolor-blue-light, #eff6ff);
  }
`;

const StyledProductName = styled.span`
  font-weight: 600;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledFamilyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: var(--twentycolor-gray-light, #f3f4f6);
  color: var(--twentyfont-color-secondary);
  white-space: nowrap;
`;

const StyledPrice = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  white-space: nowrap;
  text-align: right;
  min-width: 70px;
`;

const StyledEmptyMessage = styled.li`
  padding: 12px;
  font-size: 13px;
  color: var(--twentyfont-color-secondary);
  text-align: center;
`;

export const CpqProductPicker = ({
  products,
  value,
  onChange,
  placeholder = 'Search products...',
}: CpqProductPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredProducts = products.filter((product) => {
    if (searchQuery.length === 0) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.productFamily.toLowerCase().includes(query)
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) {
      return;
    }
    const items = listRef.current.querySelectorAll('li');
    const highlightedItem = items[highlightedIndex];
    if (highlightedItem) {
      highlightedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const selectProduct = useCallback(
    (product: CatalogEntry) => {
      onChange(product);
      setSearchQuery('');
      setIsOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          setIsOpen(true);
          event.preventDefault();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredProducts.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredProducts.length - 1,
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredProducts[highlightedIndex]) {
            selectProduct(filteredProducts[highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filteredProducts, highlightedIndex, selectProduct],
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
      if (!isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen],
  );

  const displayValue = isOpen ? searchQuery : (value?.name ?? '');

  return (
    <StyledPickerContainer ref={containerRef}>
      <StyledPickerInput
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {isOpen && (
        <StyledDropdown ref={listRef}>
          {filteredProducts.length === 0 ? (
            <StyledEmptyMessage>No products found</StyledEmptyMessage>
          ) : (
            filteredProducts.map((product, index) => (
              <StyledDropdownItem
                key={product.sku}
                highlighted={index === highlightedIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectProduct(product);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <StyledProductName>{product.name}</StyledProductName>
                <StyledFamilyBadge>{product.productFamily}</StyledFamilyBadge>
                <StyledPrice>
                  {formatListPrice(
                    product.listPriceAmountMicros,
                    product.listPriceCurrencyCode,
                  )}
                </StyledPrice>
              </StyledDropdownItem>
            ))
          )}
        </StyledDropdown>
      )}
    </StyledPickerContainer>
  );
};
