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
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-700 font-medium">
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right mt-0.5">{percent}%</p>
    </div>
  );
}
