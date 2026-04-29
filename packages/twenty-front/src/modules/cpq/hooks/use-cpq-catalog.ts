import { useState, useEffect } from 'react';

import {
  PHENOTIPS_CATALOG_US,
  type CatalogEntry,
} from '@/cpq/constants/cpq-phenotips-catalog';

export const useCpqCatalog = () => {
  const [products, setProducts] = useState<CatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, use static catalog. TASK-131 will migrate to Apollo Client.
    setProducts(PHENOTIPS_CATALOG_US);
    setIsLoading(false);
  }, []);

  return { products, isLoading };
};
