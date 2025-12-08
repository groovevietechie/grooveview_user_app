import { QrCodeIcon, ShoppingBagIcon, TruckIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            GrooveVie
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Scan • Order • Enjoy
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            The easiest way to order food from your favorite restaurants.
            Simply scan the QR code and place your order instantly.
          </p>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCodeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h3>
              <p className="text-gray-600">
                Use your phone's camera to scan the QR code at any participating restaurant
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Place Order</h3>
              <p className="text-gray-600">
                Browse the menu, add items to your cart, and customize your order
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enjoy</h3>
              <p className="text-gray-600">
                Choose dining in or delivery, pay your way, and enjoy your meal
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose GrooveVie?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Customers</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• No app downloads required</li>
                <li>• Works on any smartphone</li>
                <li>• Secure and contactless ordering</li>
                <li>• Real-time menu updates</li>
                <li>• Multiple payment options</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Restaurants</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Easy menu management</li>
                <li>• Real-time order tracking</li>
                <li>• Custom branding and themes</li>
                <li>• No additional hardware needed</li>
                <li>• Seamless integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to Order?
            </h3>
            <p className="text-gray-600 mb-6">
              Look for GrooveVie QR codes at participating restaurants and start ordering instantly.
            </p>
            <div className="text-sm text-gray-500">
              This app is accessed through QR codes provided by restaurants.
              <br />
              Contact your favorite restaurant to get started.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>&copy; 2025 GrooveVie. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
