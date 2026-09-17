import React, { useMemo, useState } from 'react';
import type { DetailedRecipe } from './detailedFoodLibrary';
import {
  CATEGORY_FALLBACK_IMAGES,
  foodImageFor,
  getRecipeCanonicalId,
  validateRecipeImage,
} from '../services/foodImageService';

export { CATEGORY_FALLBACK_IMAGES, foodImageFor, getRecipeCanonicalId, validateRecipeImage };

export interface ValidatedFoodImageProps {
  recipe: Partial<DetailedRecipe> & Record<string, unknown>;
  alt: string;
  className?: string;
  allowVirtualToggle?: boolean;
}

/**
 * UI adapter for the V9 food image contract.
 * The canonical image/validation logic lives in foodImageService.ts;
 * this component keeps FoodSection's rendering contract stable.
 */
export function ValidatedFoodImage({
  recipe,
  alt,
  className,
}: ValidatedFoodImageProps) {
  const validated = useMemo(() => validateRecipeImage(recipe), [recipe]);
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
        const fallback =
          recipe.category && CATEGORY_FALLBACK_IMAGES[String(recipe.category)]
            ? CATEGORY_FALLBACK_IMAGES[String(recipe.category)]
            : CATEGORY_FALLBACK_IMAGES.default;
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
