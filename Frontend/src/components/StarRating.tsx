interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 14 }: StarRatingProps) {
  return (
    <div className="flex gap-[2px] items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
          <img
            alt=""
            className="absolute inset-0 size-full block"
            src={i <= rating ? '/assets/64b87.svg' : '/assets/d5950.svg'}
          />
        </div>
      ))}
    </div>
  );
}
