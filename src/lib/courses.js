import bookkeeping from '../assets/img/learn_bookkeeping.jpg'
import pricing from '../assets/img/learn_pricing.jpg'
import borrowing from '../assets/img/learn_borrowing.jpg'
import selling from '../assets/img/learn_selling.jpg'
import marketing from '../assets/img/learn_marketing.jpg'
import farming from '../assets/img/learn_farming.jpg'

export const topics = ['Business Basics', 'Financial Management', 'Marketing', 'Agriculture']

export const courses = [
  {
    id: 'basic-bookkeeping',
    title: 'Basic Bookkeeping for Small Businesses',
    summary: 'Learn how to track your income and expenses.',
    minutes: 15,
    level: 'Beginner',
    topic: 'Financial Management',
    image: bookkeeping,
    sections: [
      { h: 'Why keep records?', p: 'Records tell you whether you are really earning. Without them it is easy to confuse sales (money in) with profit (money left after costs). Good records also make it much easier to apply for a loan or file taxes.' },
      { h: 'Set up a simple ledger', p: 'Use a notebook or a spreadsheet with five columns: Date, Description, Money In, Money Out, Balance. Write down every sale and every purchase the same day, even small ones.' },
      { h: 'Separate business and personal money', p: 'Keep one wallet, envelope or e-wallet account for the business only. When you take money for yourself, record it as "Owner withdrawal" instead of mixing it with expenses.' },
      { h: 'Review every week', p: 'Add up Money In and Money Out for the week. Money In minus Money Out is your cash result. Compare it with last week to spot rising costs early.' }
    ],
    takeaways: ['Record every transaction on the same day', 'Keep business and personal money separate', 'Review totals weekly, not yearly'],
    resources: [
      { label: 'Bureau of Internal Revenue – registration & taxes', url: 'https://www.bir.gov.ph' },
      { label: 'DTI Negosyo Center – free business advice', url: 'https://www.dti.gov.ph' }
    ]
  },
  {
    id: 'set-the-right-price',
    title: 'How to Set The Right Price for Your Product',
    summary: 'Make sure you get the right profit.',
    minutes: 12,
    level: 'Beginner',
    topic: 'Business Basics',
    image: pricing,
    sections: [
      { h: 'Know your true cost', p: 'Add up materials, packaging, transport, your labor time and a share of overhead (rent, electricity, fees) for each unit. Many sellers forget labor and end up working for free.' },
      { h: 'Choose your profit margin', p: 'Selling price = cost ÷ (1 − margin). For example, a ₱80 cost with a 40% margin gives ₱80 ÷ 0.6 ≈ ₱133. Start with a margin you can sustain, not the lowest price in the market.' },
      { h: 'Check the market', p: 'Look at what similar local products sell for. If you are higher, be ready to explain why: freshness, handmade quality, organic, story. If you are lower, you may be underpricing.' },
      { h: 'Test and adjust', p: 'Change prices slowly and watch sales for two weeks. Bundles ("3 for ₱350") raise the average order without cutting your margin.' }
    ],
    takeaways: ['Price from cost, not from guesswork', 'Include your own labor', 'Review prices every season'],
    resources: [
      { label: 'DTI Negosyo Center – pricing & business help', url: 'https://www.dti.gov.ph' }
    ]
  },
  {
    id: 'responsible-borrowing',
    title: 'Responsible Borrowing and Loan Management',
    summary: 'Understand your options and avoid over-indebtedness.',
    minutes: 20,
    level: 'Beginner',
    topic: 'Financial Management',
    image: borrowing,
    sections: [
      { h: 'Decide if you need a loan', p: 'Borrow for things that earn money back, such as equipment, stock or packaging, not for everyday expenses. Estimate how much extra income the loan will create.' },
      { h: 'Compare your options', p: 'Banks, cooperatives, microfinance institutions and government programs all differ in interest, fees and requirements. Ask for the total cost of the loan, not just the monthly rate.' },
      { h: 'Check you can repay', p: 'A safe rule: total monthly loan payments should be well below your average monthly profit. Test the numbers on a slow month, not your best month.' },
      { h: 'Avoid the debt trap', p: 'Never borrow from one lender to pay another. Avoid unregistered lenders, and read every term before signing. If you struggle to pay, talk to the lender early.' }
    ],
    takeaways: ['Borrow to earn, not to spend', 'Ask for the total cost of credit', 'Keep payments well below profit'],
    resources: [
      { label: 'Bangko Sentral ng Pilipinas – financial consumer info', url: 'https://www.bsp.gov.ph' },
      { label: 'DTI Negosyo Center – financing programs', url: 'https://www.dti.gov.ph' }
    ]
  },
  {
    id: 'online-selling-tips',
    title: 'Online Selling Tips for Local Producers',
    summary: 'Research more about customers and grow your sales.',
    minutes: 10,
    level: 'Beginner',
    topic: 'Marketing',
    image: selling,
    sections: [
      { h: 'Take better photos', p: 'Shoot near a window in daylight with a plain background. Take a close-up, a shot showing size, and one showing the product in use.' },
      { h: 'Write helpful descriptions', p: 'Say what it is, what it is made of, the size or weight, and how to store or use it. Mention where it is made. Buyers trust local stories.' },
      { h: 'Be clear on delivery', p: 'State your delivery areas, fees, and how fresh items are packed. Fast replies to messages convert more buyers than low prices.' },
      { h: 'Ask for reviews', p: 'After each order, politely ask the customer for a short review or photo. A few real reviews build trust quickly.' }
    ],
    takeaways: ['Daylight photos sell', 'Describe size, material and origin', 'Reply fast and ask for reviews'],
    resources: [
      { label: 'DTI Negosyo Center – e-commerce support', url: 'https://www.dti.gov.ph' }
    ]
  },
  {
    id: 'social-media-for-sellers',
    title: 'Promoting Your Products on Social Media',
    summary: 'Reach nearby customers without a big budget.',
    minutes: 12,
    level: 'Beginner',
    topic: 'Marketing',
    image: marketing,
    sections: [
      { h: 'Pick one or two platforms', p: 'Focus where your customers already are. A single active page beats four neglected ones.' },
      { h: 'Show behind the scenes', p: 'Short posts of harvesting, making or packing your products feel personal and are easy to produce with a phone.' },
      { h: 'Post on a schedule', p: 'Two or three posts per week is enough. Include price, location and how to order in every post.' },
      { h: 'Link back to LocalLink', p: 'Share your product page so customers can order in one place and see your other items.' }
    ],
    takeaways: ['Be consistent, not constant', 'Show the story behind the product', 'Always include price and how to order'],
    resources: [
      { label: 'DTI Negosyo Center – marketing seminars', url: 'https://www.dti.gov.ph' }
    ]
  },
  {
    id: 'healthy-soil-basics',
    title: 'Healthy Soil and Better Harvests',
    summary: 'Simple practices to grow more with less cost.',
    minutes: 18,
    level: 'Beginner',
    topic: 'Agriculture',
    image: farming,
    sections: [
      { h: 'Know your soil', p: 'Check texture and drainage. A simple test: squeeze moist soil. If it forms a ball that crumbles easily, it is in good shape. Consider a soil test for pH and nutrients.' },
      { h: 'Feed it with compost', p: 'Compost from kitchen scraps, leaves and manure adds nutrients and helps soil hold water. Apply before planting and as a top dressing.' },
      { h: 'Rotate your crops', p: 'Do not plant the same family in the same bed every season. Rotating with legumes such as beans or peanuts restores nitrogen and reduces pests.' },
      { h: 'Protect and water wisely', p: 'Mulch to keep moisture and block weeds. Water early in the morning at the base of plants to reduce waste and disease.' }
    ],
    takeaways: ['Compost feeds soil and saves money', 'Rotate crops each season', 'Mulch and water at the base'],
    resources: [
      { label: 'Department of Agriculture – programs & guides', url: 'https://www.da.gov.ph' },
      { label: 'Agricultural Training Institute – free trainings', url: 'https://www.ati.da.gov.ph' }
    ]
  }
]
