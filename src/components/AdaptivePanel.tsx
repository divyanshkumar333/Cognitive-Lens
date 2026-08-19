"use client";

const items = [
["Information Density",92],
["Decision Load",81],
["Hidden Prerequisites",68],
["Ambiguity",74],
["Cognitive Friction",89],
];

export default function AdaptivePanel(){
return(
<section className="rounded-[30px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.07)]">

<h2 className="text-2xl font-semibold">
Cognitive Scan
</h2>

<p className="mt-2 text-zinc-500">
Hidden cognitive structure detected.
</p>

<div className="mt-8 space-y-5">

{items.map(([title,value])=>(
<div key={title}>

<div className="mb-2 flex justify-between text-sm">

<span>{title}</span>

<span>{value}%</span>

</div>

<div className="h-3 overflow-hidden rounded-full bg-zinc-100">

<div
className="h-full rounded-full bg-gradient-to-r from-[#F2B9AA] to-[#D89082]"
style={{width:`${value}%`}}
/>

</div>

</div>
))}

</div>

</section>
);
}
