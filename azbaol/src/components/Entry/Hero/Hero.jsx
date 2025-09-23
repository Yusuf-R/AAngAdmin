import Particles from "@/components/ReactBits/Particles";
import TextType from "@/components/ReactBits/TextType";
import StarBorder from "@/components/ReactBits/StarBorder";
import ElectricBorder from "@/components/ReactBits/ElectricBorder";
import {Truck, Shield, Clock, Globe, Award, Users} from 'lucide-react';
import {Button} from "@/components/ui/moving-border";

function Hero() {
    return (
        <>
            {/* intro section */}
            <section className="relative w-full h-screen overflow-hidden bg-black">

                {/* Fullscreen Particle Background */}
                <div className="absolute inset-0 z-0">
                    <Particles
                        particleColors={['#ffffff', '#ffffff']}
                        particleCount={200}
                        particleSpread={10}
                        speed={0.1}
                        particleBaseSize={100}
                        moveParticlesOnHover={true}
                        alphaParticles={false}
                        disableRotation={false}
                    />
                </div>

                {/* Centered Overlay Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
                    <TextType
                        text={["Welcome to AAngLogistics 🚀"]}
                        className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-white to-gray-300 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-transparent"
                        typingSpeed={150}
                        pauseDuration={1500}
                        showCursor={true}
                        textColors={['#366AD9']}
                        cursorCharacter=""
                        loop={true}
                    />
                    <TextType
                        text={["Fast, reliable, and intelligent delivery solutions — engineered for the modern world."]}
                        className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto"
                        typingSpeed={75}
                        pauseDuration={1500}
                        showCursor={false}
                        textColors={['#FFF']}
                        loop={true}
                    />
                    <div className="mt-8">
                        <Button
                            borderRadius="1.75rem"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-lg transition  dark:bg-slate-900  dark:text-white border-neutral-200 dark:border-slate-800"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </section>
            <section className="relative py-20 bg-gradient-to-b from-black to-gray-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Why Choose AAngLogistics?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Delivering excellence across the globe with cutting-edge technology and unmatched
                            reliability
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Truck className="w-8 h-8 text-blue-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Global Delivery Network</h3>
                            <p className="text-gray-400">
                                Reach every corner of the world with our extensive logistics network and reliable
                                partners.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-green-500/30 transition-all duration-300">
                            <div
                                className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Shield className="w-8 h-8 text-green-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Secure & Insured</h3>
                            <p className="text-gray-400">
                                Your shipments are protected with comprehensive insurance and state-of-the-art security.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                            <div
                                className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Clock className="w-8 h-8 text-purple-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Real-time Tracking</h3>
                            <p className="text-gray-400">
                                Monitor your shipments 24/7 with our advanced GPS tracking and live updates.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-orange-500/30 transition-all duration-300">
                            <div
                                className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Globe className="w-8 h-8 text-orange-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Sustainable Solutions</h3>
                            <p className="text-gray-400">
                                Eco-friendly delivery options and carbon-neutral shipping for a better tomorrow.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-red-500/30 transition-all duration-300">
                            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Award className="w-8 h-8 text-red-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Award-winning Service</h3>
                            <p className="text-gray-400">
                                Recognized globally for excellence in logistics and customer satisfaction.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div
                            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                            <div className="w-16 h-16 bg-cyan-600/20 rounded-2xl flex items-center justify-center mb-6">
                                <Users className="w-8 h-8 text-cyan-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">24/7 Support</h3>
                            <p className="text-gray-400">
                                Our dedicated team is always available to assist you with any needs or concerns.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-20 bg-black">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="p-6">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">50K+</div>
                            <div className="text-gray-400">Successful Deliveries</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">120+</div>
                            <div className="text-gray-400">Countries Served</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">99.8%</div>
                            <div className="text-gray-400">On-time Rate</div>
                        </div>
                        <div className="p-6">
                            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">24/7</div>
                            <div className="text-gray-400">Customer Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-700">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Logistics?
                    </h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied customers who trust AAngLogistics for their delivery needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg transition transform hover:scale-105">
                            Start Shipping Now
                        </button>
                        <button
                            className="px-8 py-4 border border-white/30 text-white font-semibold rounded-lg transition transform hover:scale-105">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>

        </>
    );
}

export default Hero;