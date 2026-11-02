import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "react-router-dom";
import { BASE_URL } from "@/config";
import { authContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import Spinner from "@/components/ui/spinner";

function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading , setLoading] = useState(false);
  const { id } = useParams();
  const { token } = useContext(authContext);

  const handleSubmitFeedback = async e => {
    e.preventDefault();
    if (!token) {
      return toast.error('Please login to give feedback');
    }
    setLoading(true);
    try {
      // Check if rating or reviewText is empty
      if (!rating || !reviewText.trim()) {
        setLoading(false);
        return toast.error('Please fill all fields');
      }


      const res = await fetch(`${BASE_URL}/doctors/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, reviewText })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message);
      }

      setLoading(false);
      toast.success(result.message);
      setRating(0);
      setHover(0);
      setReviewText('');
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmitFeedback} className="rounded-2xl border border-border bg-background/50 p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          How would you rate your overall experience?
        </h3>
        <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[...Array(5).keys()].map((index) => {
            const starValue = index + 1;
            const filled = starValue <= (hover || rating);
            return (
              <motion.button
                key={starValue}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHover(starValue)}
                onDoubleClick={() => {
                  setHover(0);
                  setRating(0);
                }}
                aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                className={`${filled ? "text-brand-amber" : "text-muted-foreground/40"} transition-colors`}
              >
                <Star className={`h-7 w-7 ${filled ? "fill-current" : ""}`} />
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Share your feedback
        </h3>
        <Textarea
          placeholder="What went well? What could be better?"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="mt-5">
        {loading ? <Spinner className="text-primary-foreground" /> : 'Submit review'}
      </Button>
    </form>
  );
}

export default FeedbackForm;
