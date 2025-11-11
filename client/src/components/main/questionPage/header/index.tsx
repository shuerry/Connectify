import './index.css';
import OrderButton from './orderButton';
import { OrderType } from '../../../../types/types';
import { orderTypeDisplayName } from '../../../../types/constants';
import AskQuestionButton from '../../askQuestionButton';

/**
 * Interface representing the props for the QuestionHeader component.
 *
 * titleText - The title text displayed at the top of the header.
 * qcnt - The number of questions to be displayed in the header.
 * setQuestionOrder - A function that sets the order of questions based on the selected message.
 */
interface QuestionHeaderProps {
  titleText: string;
  qcnt: number;
  setQuestionOrder: (order: OrderType) => void;
}

/**
 * QuestionHeader component displays the header section for a list of questions.
 * It includes the title, a button to ask a new question, the number of the quesions,
 * and buttons to set the order of questions.
 *
 * @param titleText - The title text to display in the header.
 * @param qcnt - The number of questions displayed in the header.
 * @param setQuestionOrder - Function to set the order of questions based on input message.
 */
const QuestionHeader = ({ titleText, qcnt, setQuestionOrder }: QuestionHeaderProps) => (
  <div className='question-header'>
    <div className='page-header'>
      <div className='header-content'>
        <h1 className='page-title'>{titleText}</h1>
        <div className='question-count'>
          <span className='count-number'>{qcnt}</span>
          <span className='count-label'>{qcnt === 1 ? 'question' : 'questions'}</span>
        </div>
      </div>
      <div className='page-actions'>
        <AskQuestionButton />
      </div>
    </div>
    
    <div className='filter-section'>
      <div className='filter-label'>Sort by:</div>
      <div className='filter-buttons'>
        {Object.keys(orderTypeDisplayName).map(order => (
          <OrderButton
            key={order}
            orderType={order as OrderType}
            setQuestionOrder={setQuestionOrder}
          />
        ))}
      </div>
    </div>
  </div>
);

export default QuestionHeader;
