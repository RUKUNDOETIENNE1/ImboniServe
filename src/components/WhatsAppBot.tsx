import { useState } from 'react'
import { MessageCircle, Send, HelpCircle } from 'lucide-react'

export default function WhatsAppBot() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, text: 'Welcome to Imboni Serve! Type HELP for commands', fromBot: true },
    { id: 2, text: 'Try: SALES TODAY or STOCK', fromBot: true }
  ])
  
  const commands = {
    'HELP': 'Show all commands',
    'SALES TODAY': 'Get today\'s sales',
    'SALES WEEK': 'Weekly sales report',
    'PROFIT TODAY': 'Today\'s profit',
    'STOCK': 'Check low stock items',
    'ADD SALE [item] [qty] [price]': 'Record a sale',
    'ADD STOCK [item] [qty]': 'Add inventory',
    'REPORT DAILY': 'Daily report',
    'REPORT WEEKLY': 'Weekly summary',
    'MENU': 'View menu items',
    'STATUS': 'Restaurant status',
    'PAYMENT [amount] [method]': 'Record payment'
  }
  
  const handleSend = () => {
    if (!message.trim()) return
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), text: message, fromBot: false }])
    
    // Simulate bot response
    setTimeout(() => {
      const upperMessage = message.toUpperCase()
      let response = ''
      
      if (upperMessage.includes('HELP')) {
        response = '📱 Available Commands:\n' + 
          Object.entries(commands).map(([cmd, desc]) => `${cmd} - ${desc}`).join('\n')
      } else if (upperMessage.includes('SALES TODAY')) {
        response = '💰 Today\'s Sales:\nTotal: RWF 85,000\nTransactions: 12\nAvg: RWF 7,083'
      } else if (upperMessage.includes('STOCK')) {
        response = '📦 Low Stock Alert:\n• Fanta: 45 bottles (min: 50)\n• Chicken: 8.2kg (min: 8kg)\n• Rice: 15kg (min: 20kg)'
      } else if (upperMessage.includes('PROFIT')) {
        response = '📈 Today\'s Profit:\nRevenue: RWF 85,000\nCost: RWF 42,500\nProfit: RWF 42,500\nMargin: 50%'
      } else {
        response = 'Got it! I\'ll process: ' + message + '\nType HELP for all commands'
      }
      
      setMessages(prev => [...prev, { id: Date.now(), text: response, fromBot: true }])
    }, 1000)
    
    setMessage('')
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">WhatsApp Bot</h3>
            <p className="text-sm text-gray-500">Live chat with your restaurant</p>
          </div>
        </div>
        <button className="text-green-600 hover:text-green-700">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto mb-4 space-y-3 p-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.fromBot
                ? 'bg-gray-100 text-gray-800 ml-auto'
                : 'bg-green-100 text-green-900 mr-auto'
            }`}
            style={{ marginLeft: msg.fromBot ? 'auto' : '0' }}
          >
            <p className="whitespace-pre-line">{msg.text}</p>
            <span className="text-xs opacity-70 mt-1 block">
              {msg.fromBot ? 'Bot' : 'You'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a command (HELP for options)..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSend}
          className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      
      {/* Quick Commands */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['SALES TODAY', 'STOCK', 'PROFIT TODAY', 'HELP'].map(cmd => (
          <button
            key={cmd}
            onClick={() => setMessage(cmd)}
            className="text-sm bg-gray-100 hover:bg-gray-200 p-2 rounded"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  )
}