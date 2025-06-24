import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~~/components/ui/dialog';
import { Slider } from '~~/components/ui/slider';
import { Button } from '~~/components/ui/button';

interface IncentivizeDialogProps {
    onSubmit?: (amount: number) => void;
    disabled?: boolean;
    niche: string
}

const Incentivize: React.FC<IncentivizeDialogProps> = ({
    onSubmit,
    disabled = false,
    niche
}) => {
    const [monAmount, setMonAmount] = useState<number[]>([0]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSliderChange = (value: number[]) => {
        setMonAmount(value);
    };

    setIsSubmitting(false) // hot fix 

    const currentAmount = monAmount[0];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className="cursor-pointer px-6 py-3 bg-neutral-800 border border-neutral-600 rounded-xl text-white hover:bg-neutral-700 hover:border-neutral-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                >
                    Incentivize Participants
                </button>
            </DialogTrigger>

            <DialogContent className="bg-neutral-800 border border-neutral-700 text-white max-w-md mx-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-semibold text-center">
                        Amount of $MON
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-6">
                    {/* Slider Section */}
                    <div className="space-y-6">
                        <div className="px-4">
                            <Slider
                                value={monAmount}
                                onValueChange={handleSliderChange}
                                max={1}
                                min={0}
                                step={0.01}
                                className="w-full "
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Amount Display */}
                        <div className="text-center">
                            <div className="text-md font-bold text-white">
                                Incentivizing {niche} participants with <span className='text-purple-700'>{currentAmount.toFixed(2)} MON </span>
                            </div>
                            <div className="text-sm text-neutral-400 mt-1">
                                ${(currentAmount * 1.2).toFixed(2)} USD
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={onSubmit}
                            disabled={isSubmitting || currentAmount === 0}
                            className="cursor-pointer px-8 py-2 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                    Submitting...
                                </div>
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default Incentivize;