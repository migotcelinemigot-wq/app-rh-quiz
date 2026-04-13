"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ScoreData {
  theme: string;
  label: string;
  score: number;
}

export default function ScoreRadar({ data }: { data: ScoreData[] }) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    subject: d.label.length > 14 ? d.label.slice(0, 14) + "…" : d.label,
    score: Math.round(d.score),
    fullLabel: d.label,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "#6b7280" }}
        />
        <Tooltip
          formatter={(value: number, _: string, props: { payload?: { fullLabel?: string } }) => [
            `${value}%`,
            props.payload?.fullLabel ?? "",
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
