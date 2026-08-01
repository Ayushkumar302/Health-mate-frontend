import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "react-router-dom";
import { BASE_URL, token } from "@/config";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";

function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading , setLoading] = useState(false);
  const { id } = useParams();

  const handleSubmitFeedback = async e => {
    e.preventDefault(); 
    setLoading(true);
    try {
      // Check if rating or reviewText is empty
      if (!rating || !reviewText) {
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
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmitFeedback}>
      <div>
        <h3 className="text-headingColor text-[16px] mt-0 leading-6 font-semibold mb-4">
          How would you rate overall experience?
        </h3>
        <div>
          {[...Array(5).keys()].map((index) => {
            const starValue = index + 1;
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(rating)}
                onDoubleClick={() => {
                  setHover(0);
                  setRating(0);
                }}
                className={`${
                  starValue <= (hover || rating) ? "text-yellowColor" : "text-gray-400"
                } bg-transparent border-none outline-none text-[22px] cursor-pointer`}
              >
                <span>
                  <StarFilledIcon />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-headingColor text-[16px] mt-0 leading-6 font-semibold mb-4">
          Share your feedback or suggestions
        </h3>
        <Textarea
          placeholder="Type your message here."
          onChange={(e) => setReviewText(e.target.value)} 
        />
      </div>

      <Button type="submit">
        {loading ? <HashLoader size={25} color="#fff" /> : 'Submit Feedback'}
      </Button>
    </form>
  );
}

export default FeedbackForm;
