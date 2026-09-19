import React, { useMemo, useState } from 'react';
import {
  CATEGORY_FALLBACK_IMAGES,
  foodImageFor,
  getRecipeCanonicalId,
  validateRecipeImage,
} from '../services/foodImageService';

export { CATEGORY_FALLBACK_IMAGES, foodImageFor, getRecipeCanonicalId, validateRecipeImage };

export interface ValidatedFoodImageProps {
  recipe: unknown;
  alt: string;
  className?: string;
  allowVirtualToggle?: boolean;
}

/**
 * UI adapter for the V9 food image contract.
 * The canonical image/validation logic lives in foodImageService.ts;
 * this component deliberately accepts the different recipe shapes already
 * used by FoodSection/FoodView and lets the service validate the runtime data.
 */
export function ValidatedFoodImage({
  recipe,
  alt,
  className,
}: ValidatedFoodImageProps) {
  const validated = useMemo(
    () => validateRecipeImage(recipe as Parameters<typeof validateRecipeImage>[0]),
    [recipe],
  );
  const [src, setSrc] = useState(validated.validatedUrl);

  React.useEffect(() => {
    setSrc(validated.validatedUrl);
  }, [validated.validatedUrl]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        const candidate = recipe as { category?: unknown };
        const category = String(candidate.category ?? 'default');
        const fallback = CATEGORY_FALLBACK_IMAGES[category] ?? CATEGORY_FALLBACK_IMAGES.default;
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
