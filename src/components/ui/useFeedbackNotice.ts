import { useContext } from 'react';
import { FeedbackContext } from '../../context/FeedbackContext';

export function useFeedbackNotice() {
    const context = useContext(FeedbackContext);
    if (!context) throw new Error('FeedbackProvider required');
    return context;
}
