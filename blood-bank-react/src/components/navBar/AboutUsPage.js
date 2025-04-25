import React from 'react';

import './AboutUsPage.css';

function AboutUsPage() {
    return (
        <div className="about-us-container">
            <h1>About Us</h1>
            <section className="about-section">
                <h2>Our Mission</h2>
                <p>
                    At [Blood Bank Name], our mission is to provide life-saving blood to patients in need. We work closely with hospitals, medical centers, and healthcare providers to ensure that there is always a steady supply of safe, high-quality blood available for transfusions.
                </p>
            </section>

            <section className="about-section">
                <h2>What We Do</h2>
                <ul>
                    <li>Collect, process, and store blood donations from generous donors.</li>
                    <li>Distribute blood and blood products to hospitals and clinics in need.</li>
                    <li>Organize blood donation drives and educate the public about the importance of donating blood.</li>
                    <li>Ensure the safety and quality of all blood donations through rigorous testing and screening procedures.</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Why Donate Blood?</h2>
                <p>
                    Donating blood is a simple yet powerful way to save lives. Every donation can help save up to three lives. Your blood can help cancer patients, accident victims, surgery patients, and many others who require blood transfusions. By donating blood, you're giving a second chance to those in need.
                </p>
            </section>

            <section className="about-section">
                <h2>Contact Us</h2>
                <p>
                    If you have any questions or would like to know more about how you can help, please feel free to reach out to us:
                </p>
                <ul>
                    <li><strong>Email:</strong> info@[bloodbankname].org</li>
                    <li><strong>Phone:</strong> (123) 456-7890</li>
                    <li><strong>Address:</strong> 123 Blood Bank St., City, State, ZIP</li>
                </ul>
            </section>
        </div>
    );
};

export default AboutUsPage;
