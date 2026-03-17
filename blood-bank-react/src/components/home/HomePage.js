import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';
import Logo from '../../assets/logo.png';
import FeedbackCarousel from './FeedbackCarousel';
import 'font-awesome/css/font-awesome.min.css';
import swal from 'sweetalert';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTranslation } from '../../context/LanguageContext';


function HomePage() {
    const { t } = useTranslation();

    const advantages = [
        {
            title: t('quickDonorMatching'),
            description: t('quickDonorMatchingDesc')
        },
        {
            title: t('realTimeListings'),
            description: t('realTimeListingsDesc')
        },
        {
            title: t('secureVerified'),
            description: t('secureVerifiedDesc')
        },
        {
            title: t('communitySupport'),
            description: t('communitySupportDesc')
        }
    ];
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                swal("Not logged in");
                navigate('/');
                return;
            }

            await axios.get('http://localhost:4000/api/users/logout', {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                }
            });

            localStorage.removeItem('token');
            swal("Logout successfully");
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            // Still logout even if API call fails
            localStorage.removeItem('token');
            swal("Logout completed");
            navigate('/');
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            className="home-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            role="main"
            aria-labelledby="main-heading"
        >
            <motion.div
                className="advantages-section"
                variants={containerVariants}
                aria-labelledby="advantages-heading"
            >
                <motion.h2
                    id="advantages-heading"
                    variants={titleVariants}
                    tabIndex="-1"
                >
                    {t('whyUseBloodConnect')}
                </motion.h2>
                <motion.div
                    className="advantages-cards"
                    variants={containerVariants}
                    role="list"
                    aria-label="Blood donation advantages"
                >
                    {advantages.map((adv, index) => (
                        <motion.div
                            key={index}
                            className="advantage-card"
                            variants={cardVariants}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.15)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            role="listitem"
                            tabIndex="0"
                            aria-describedby={`advantage-${index}-desc`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    // Could add focus management or other interactions here
                                }
                            }}
                        >
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                id={`advantage-${index}-title`}
                            >
                                {adv.title}
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                id={`advantage-${index}-desc`}
                            >
                                {adv.description}
                            </motion.p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Feedback Carousel Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                role="region"
                aria-labelledby="feedback-heading"
            >
                <h2 id="feedback-heading" className="sr-only">User Feedback</h2>
                <FeedbackCarousel />
            </motion.div>

            {/* <div className="card-section">
                {cards.map((card, index) => (
                    <div key={index} className="info-card">
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                    </div>
                ))}
            </div> */}

            {/* <div className="button-group center-button">
                <button onClick={handleLogin} className="login-btn">
                    Login
                </button>
            </div> */}
        </motion.div>
    );
}

export default HomePage;
