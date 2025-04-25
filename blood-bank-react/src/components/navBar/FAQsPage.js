import React, { useState } from 'react';
import './FAQsPage.css';

function FAQsPage() {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqData = [
        {
            question: "What is a blood bank?",
            answer: "A blood bank is a place where blood is collected, stored, and distributed for transfusions. Blood banks maintain different blood types and process donations to ensure safe blood for patients in need."
        },
        {
            question: "How can I donate blood?",
            answer: "To donate blood, you can visit a local blood donation center or a blood bank during their donation drives. You'll be asked to fill out a health questionnaire and undergo a brief medical screening before donating."
        },
        {
            question: "Who can donate blood?",
            answer: "Anyone who is healthy, over the age of 18, and weighs at least 110 pounds can donate blood. Certain health conditions and medications may disqualify some individuals from donating."
        },
        {
            question: "Is blood donation safe?",
            answer: "Yes, donating blood is generally safe. The procedure is done under sterile conditions, and the amount of blood donated is small, which the body quickly replenishes."
        },
        {
            question: "How often can I donate blood?",
            answer: "You can donate whole blood every 56 days, while plasma and platelet donations can be done more frequently, depending on the guidelines of the donation center."
        }
    ];

    const toggleAnswer = (index) => {
        setActiveIndex(activeIndex === index ? null : index); // Toggle answer visibility
    };

    return (
        <div className="faq-container">
            <h1>Frequently Asked Questions - Blood Bank</h1>
            <div className="accordion">
                {faqData.map((faq, index) => (
                    <div key={index} className="accordion-item">
                        <button
                            className="accordion-header"
                            onClick={() => toggleAnswer(index)}
                        >
                            {faq.question}
                        </button>
                        {activeIndex === index && (
                            <div className="accordion-body">
                                <p>{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQsPage;

