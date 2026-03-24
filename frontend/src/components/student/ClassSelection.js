import React, { useState } from 'react';
import './ClassSelection.css';

const ClassSelection = ({ user, onSelect }) => {
    const [selectedItem, setSelectedItem] = useState('');

    const items = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedItem) {
            onSelect({ class: selectedItem });
        }
    };

    return (
        <div className="selection-overlay student-selection">
            <div className="selection-card glass">
                <h2>👋 Welcome Student!</h2>
                <p>
                    Please select your standard to see relevant study materials.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Select Your Standard</label>
                        <div className="grid-options">
                            {items.map(item => (
                                <div
                                    key={item}
                                    className={`option-item ${selectedItem === item ? 'active' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {item}th
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-secondary selection-btn"
                        disabled={!selectedItem}
                    >
                        Enter My Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClassSelection;
