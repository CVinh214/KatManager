import { redirect } from 'next/navigation';

export default function EmployeeSchedulePage() {
  // Employee schedule page is hidden — redirect to dashboard.
  redirect('/dashboard');
}
