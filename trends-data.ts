import silverRunner from "@/assets/trend-1906r.jpg";
import skateLow from "@/assets/trend-gum-skate.jpg";
import courtHigh from "@/assets/trend-court-high.jpg";
import trailRunner from "@/assets/trend-trail.jpg";
import terrace from "@/assets/trend-terrace.jpg";

export type Sneaker = {
  brand: string;
  model: string;
  colorway: string;
  image: string;
  score: number;
  movement: number;
  status: string;
  rocks: number;
};

export type Trend = Sneaker & { section: string };

export const trends: Trend[] = [
  { section: "RISING NOW", brand: "NEW BALANCE", model: "1906R", colorway: "Silver Metallic / Rain Cloud", image: silverRunner, score: 82, movement: 14, status: "RISING", rocks: 22900 },
  { section: "UNDERGROUND", brand: "LAST RESORT AB", model: "VM001 SUEDE", colorway: "Black / Gum", image: skateLow, score: 68, movement: 11, status: "UNDERGROUND", rocks: 8400 },
  { section: "MOST ROCKED", brand: "JORDAN", model: "COURT HIGH '85", colorway: "Varsity Red / Sail", image: courtHigh, score: 94, movement: 6, status: "MOST ROCKED", rocks: 91400 },
  { section: "BREAKOUT", brand: "SALOMON", model: "XT-6", colorway: "Moss / Ebony", image: trailRunner, score: 31, movement: 19, status: "BREAKOUT", rocks: 12700 },
  { section: "COMMUNITY PICKS", brand: "ADIDAS", model: "GAZELLE INDOOR", colorway: "Burgundy / Cream", image: terrace, score: 86, movement: 8, status: "COMMUNITY PICK", rocks: 34100 },
];
