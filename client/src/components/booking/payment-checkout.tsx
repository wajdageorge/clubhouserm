import { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface PaymentCheckoutProps {
  bookingId: string;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentCheckout({ bookingId, amount, onSuccess, onCancel }: PaymentCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await apiRequest("/api/confirm-payment", "POST", {
          bookingId,
          paymentIntentId: paymentIntent.id,
        });

        toast({
          title: "Payment Successful!",
          description: "Your tee time booking is confirmed.",
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="font-medium">Total Amount</span>
          <span className="text-2xl font-bold text-primary" data-testid="text-payment-amount">
            ${amount}
          </span>
        </div>
      </div>

      <PaymentElement />

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-submit-payment"
        >
          {isProcessing ? "Processing..." : `Pay $${amount}`}
        </Button>
      </div>
    </form>
  );
}
