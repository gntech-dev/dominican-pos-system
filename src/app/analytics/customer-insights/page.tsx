import { Metadata } from 'next'
import CustomerInsightsDashboard from '@/components/analytics/CustomerInsightsDashboard'

export const metadata: Metadata = {
  title: 'Customer Insights | POS Analytics',
  description: 'Analyze customer behavior, purchase patterns, and segmentation data',
}

export default function CustomerInsightsPage() {
  return <CustomerInsightsDashboard />
}
