import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  leftLabel,
  rightLabel,
  formatValue,
  className = ""
}: ParameterSliderProps) {
  const handleChange = (values: number[]) => {
    onChange(values[0]);
  };

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex items-center space-x-3">
        {leftLabel && (
          <span className="text-sm text-slate-500 min-w-max">{leftLabel}</span>
        )}
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        {rightLabel && (
          <span className="text-sm text-slate-500 min-w-max">{rightLabel}</span>
        )}
      </div>
      <div className="text-center">
        <span className="text-sm font-medium text-slate-600">{displayValue}</span>
      </div>
    </div>
  );
}
