"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card"
import { Badge } from "../../Components/ui/badge"
import { Separator } from "../../Components/ui/separator"
import { Button } from "../../Components/ui/button"
import { CreditCard, ArrowRight } from "lucide-react"
import moment from "moment"

interface OrderItem {
  product: string
  title: string
  image: string
  price: number
  quantity: number
  category: string
}

interface Order {
  _id: string
  orderNumber: string
  orderItems: OrderItem[]
  totalAmount: number
  status: string
  createdAt: string
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userId = localStorage.getItem("userId")
        if (!userId) {
          setError("User not logged in.")
          setIsLoading(false)
          return
        }
        const res = await fetch("/api/orders", {
          headers: { userId }
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to fetch orders.")
        }
        const data = await res.json()
        setOrders(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch orders.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const handlePayment = (orderId: string) => {
    window.location.href = `/fitness-activities-and-orders/checkout?orderId=${orderId}`;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <Card className="max-w-7xl mx-auto bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-gray-900 text-white border-b-2 border-red-500">
          <CardTitle className="text-xl font-bold text-white">My Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-8 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No orders found.</div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <Card key={order._id} className="border border-gray-200">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 border-b">
                    <div>
                      <div className="font-semibold text-gray-900">Order #{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{moment(order.createdAt).format("MMMM Do YYYY, h:mm A")}</div>
                    </div>
                    <Badge className={statusColor(order.status) + " text-xs px-3 py-1 border"}>{order.status}</Badge>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.orderItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 text-base">{item.title}</div>
                              <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                              <div className="text-sm text-gray-500">{item.category}</div>
                            </div>
                            <div className="font-bold text-lg text-red-600">${item.price}</div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                        <div className="font-bold text-xl text-gray-900">Total Amount:</div>
                        <div className="font-bold text-2xl text-red-600">${order.totalAmount.toFixed(2)}</div>
                      </div>
                      
                      {/* Payment Button for Pending Orders */}
                      {order.status === "pending" && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <Button 
                            onClick={() => handlePayment(order._id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                          >
                            <CreditCard className="w-6 h-6 mr-3" />
                            Pay Now
                            <ArrowRight className="w-6 h-6 ml-3" />
                          </Button>
                          <p className="text-sm text-gray-500 text-center mt-3">
                            Complete your payment to process this order
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 