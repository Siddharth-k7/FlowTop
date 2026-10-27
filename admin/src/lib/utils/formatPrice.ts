/** Integer paise in, rupee string out. The only place paise are divided. */
export function formatPrice(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}
