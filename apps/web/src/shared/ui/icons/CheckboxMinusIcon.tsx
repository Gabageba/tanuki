type Props = {
  className: string;
};

function CheckboxMinusIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="6" rx="3" fill="currentColor" />
    </svg>
  );
}
export default CheckboxMinusIcon;
