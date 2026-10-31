"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/fields";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";

export function ReviewForm({ productId, orderId }: { productId: string; orderId: string }) {
  const [state, action, pending] = useActionState(submitReviewAction, {});
  const [rating, setRating] = useState(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laisser un avis</CardTitle>
      </CardHeader>
      <CardContent>
        {state.success ? <Alert tone="success" className="mb-3">{state.success}</Alert> : null}
        {state.error ? <Alert tone="error" className="mb-3">{state.error}</Alert> : null}

        <form action={action} className="space-y-3">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="rating" value={rating} />

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-earth-800">Votre note</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  aria-label={`${v} étoile${v > 1 ? "s" : ""}`}
                  aria-pressed={rating === v}
                  className="p-1"
                >
                  <Star
                    className={`h-7 w-7 transition ${rating >= v ? "fill-sun-500 text-sun-500" : "text-earth-300"}`}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-earth-800">
              Votre commentaire
            </label>
            <Textarea
              id="review-comment"
              name="comment"
              required
              minLength={10}
              placeholder="Qualité, fraîcheur, emballage, délai de livraison…"
              className="min-h-28"
            />
            {state.fieldErrors?.comment?.[0] ? (
              <p className="mt-1 text-xs font-medium text-kola-600">{state.fieldErrors.comment[0]}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Envoi…" : "Publier mon avis"}
          </Button>
          <p className="text-[11px] text-earth-500">Votre avis sera publié après validation par notre équipe.</p>
        </form>
      </CardContent>
    </Card>
  );
}
