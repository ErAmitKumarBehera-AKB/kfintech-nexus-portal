const Footer = () => {
  return (
<footer className="glass-panel border-t border-kfintech-border/50">      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid md:grid-cols-3 gap-10">

          {/* Company */}
          <div>
  <h2 className="text-2xl font-bold text-white mb-4">
    KFinTech Portal
  </h2>

  <p className="text-slate-400 leading-7 mb-6">
    A secure Investor Service Request Management Platform
    designed to simplify request tracking, SLA monitoring
    and communication.
  </p>

  <h4 className="text-white font-semibold mb-3">
    Platform Features
  </h4>

  <ul className="space-y-2 text-slate-400">
    <li>✓ Real-Time Request Tracking</li>
    <li>✓ SLA Monitoring</li>
    <li>✓ Secure Authentication</li>
    <li>✓ Investor Dashboard</li>
    <li>✓ Admin Management</li>
  </ul>
</div>

          {/* Quick Links */}
          {/* Quick Links */}
<div>
  <h3 className="text-lg font-semibold text-white mb-4">
    Quick Links
  </h3>

  <ul className="space-y-3 text-slate-400">
    <li>
      <a href="#" className="hover:text-white">
        Home
      </a>
    </li>

    <li>
      <a href="#" className="hover:text-white">
        Dashboard
      </a>
    </li>

    <li>
      <a href="#" className="hover:text-white">
        Services
      </a>
    </li>
  </ul>

  {/* Resources */}
  <div className="pt-6">
    <h4 className="text-white font-semibold mb-3">
      Resources
    </h4>

    <ul className="space-y-2 text-slate-400">
      <li>
        <a href="#" className="hover:text-white">
          Privacy Policy
        </a>
      </li>

      <li>
        <a href="#" className="hover:text-white">
          Terms & Conditions
        </a>
      </li>

      <li>
        <a href="#" className="hover:text-white">
          Help Center
        </a>
      </li>
    </ul>
  </div>
</div>
          
          {/* Contact */}
          {/* Contact */}
{/* Contact */}
<div>
  <h3 className="text-lg font-semibold text-white mb-4">
    Contact Us
  </h3>

  <p className="text-slate-400 mb-6">
    Get in touch with our support team for any assistance regarding investor services.
  </p>

  <div className="space-y-4">

    <div>
      <p className="text-sm text-slate-500">Email</p>
      <p className="text-slate-300 font-medium">
        support@kfintechnexus.com
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Phone</p>
      <p className="text-slate-300 font-medium">
        +91 XXXXX XXXXX
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Location</p>
      <p className="text-slate-300 font-medium">
        Bhubaneswar, Odisha, India
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Support Hours</p>
      <p className="text-slate-300 font-medium">
        Mon - Fri | 9:00 AM - 6:00 PM
      </p>
    </div>

  </div>
</div>

        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-slate-500">
          © 2026 Investor Service Request Management Portal.
          All Rights Reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;