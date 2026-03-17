import { useEffect } from 'react';

const SEOHead = ({
  title = "BloodConnect - Save Lives Through Blood Donation",
  description = "Connect with blood donors and recipients in your area. Find blood banks, request blood, and help save lives through our secure blood donation platform.",
  keywords = "blood donation, blood bank, blood donors, blood recipients, emergency blood, save lives",
  image = "/og-image.jpg",
  url = window.location.href,
  type = "website"
}) => {
  const siteName = "BloodConnect";
  const twitterHandle = "@bloodconnect";

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.getElementsByTagName('head')[0].appendChild(element);
      }
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'BloodConnect Team');
    updateMetaTag('robots', 'index, follow');

    // Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', twitterHandle);

    // Additional meta tags
    updateMetaTag('theme-color', '#c82333');
    updateMetaTag('msapplication-TileColor', '#c82333');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('apple-mobile-web-app-title', siteName);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', url);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', url);
      document.getElementsByTagName('head')[0].appendChild(canonicalLink);
    }

    // Structured Data (JSON-LD)
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (structuredDataScript) {
      structuredDataScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": siteName,
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "description": description,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-555-BLOOD",
          "contactType": "customer service",
          "availableLanguage": "English"
        },
        "sameAs": [
          "https://facebook.com/bloodconnect",
          "https://twitter.com/bloodconnect",
          "https://instagram.com/bloodconnect"
        ],
        "serviceType": "Blood Donation Platform",
        "areaServed": "Global",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Blood Donation Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Blood Donor Matching",
                "description": "Connect donors with recipients based on blood type and location"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Emergency Blood Requests",
                "description": "Quick access to blood supplies during medical emergencies"
              }
            }
          ]
        }
      });
    } else {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      structuredDataScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": siteName,
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "description": description,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-555-BLOOD",
          "contactType": "customer service",
          "availableLanguage": "English"
        },
        "sameAs": [
          "https://facebook.com/bloodconnect",
          "https://twitter.com/bloodconnect",
          "https://instagram.com/bloodconnect"
        ],
        "serviceType": "Blood Donation Platform",
        "areaServed": "Global",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Blood Donation Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Blood Donor Matching",
                "description": "Connect donors with recipients based on blood type and location"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Emergency Blood Requests",
                "description": "Quick access to blood supplies during medical emergencies"
              }
            }
          ]
        }
      });
      document.getElementsByTagName('head')[0].appendChild(structuredDataScript);
    }

  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
};

export default SEOHead;