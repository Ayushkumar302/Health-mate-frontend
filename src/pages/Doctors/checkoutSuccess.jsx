import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const CheckoutSuccess = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl max-w-lg p-8 text-center">
        <div className="mb-6">
          <DotLottieReact src="https://lottie.host/875438ba-2943-4333-8990-285e7a4b99a3/gEu4Ic2FBM.lottie" loop autoplay />
        </div>
        <h1 className="text-3xl font-extrabold text-[#181A1E] mb-3">
          Payment Successful!
        </h1>
        <p className="text-lg text-[#4E545F] mb-6">
          Thank you for your payment. Your transaction has been successfully
          completed.
        </p>
        <Button className="bg-[#0067FF] hover:bg-[#0056cc] text-white font-medium py-3 px-8 rounded-full transition ease-in-out duration-300 shadow-lg">
          <Link to="/">Continue to Homepage</Link>
        </Button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
