import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function Dashboard() {
  const [test, setTest] = useState(false)
  
  return (
    <DashboardLayout>
      <div>Test</div>
    </DashboardLayout>
  )
}
