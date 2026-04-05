interface NutritionBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export default function NutritionBar({
  label,
  current,
  target,
  unit,
  color,
}: NutritionBarProps) {
  const percent = Math.min(100, Math.round((current / target) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-800 font-semibold">
            {current}
          </span>
          <span className="text-gray-400 text-xs">
            / {target} {unit}
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right mt-1 font-medium">{percent}%</p>
    </div>
  );
}
