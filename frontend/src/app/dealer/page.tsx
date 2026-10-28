import { redirect } from 'next/navigation';

export default function DealerPage() {
  redirect('/contact?type=dealer');
}
