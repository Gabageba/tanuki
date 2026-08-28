type Props = {
  className: string;
};

function CheckboxPlusIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect y="13" width="32" height="6" rx="3" fill="currentColor" />
      <rect x="13" width="6" height="32" rx="3" fill="currentColor" />
    </svg>
  );
}
export default CheckboxPlusIcon;
