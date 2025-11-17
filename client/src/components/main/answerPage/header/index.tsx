import './index.css';

/**
 * Interface representing the props for the AnswerHeader component.
 *
 * - title - The title of the question or discussion thread.
 */
interface AnswerHeaderProps {
  title: string;
  ansCount?: number;
}

/**
 * AnswerHeader component that displays a header section for the answer page.
 * It displays the title of the question in Reddit-style format.
 *
 * @param title The title of the question or discussion thread.
 */

const AnswerHeader = ({ title, ansCount }: AnswerHeaderProps) => (
  <div className='reddit-post-header'>
    <h1 className='reddit-post-title'>{title}</h1>
    <div className='reddit-post-meta'>
      <span className='reddit-post-flair'>Discussion</span>
      {typeof ansCount === 'number' && (
        <span className='reddit-post-anscount'>{ansCount} {ansCount === 1 ? 'answer' : 'answers'}</span>
      )}
    </div>
  </div>
);

export default AnswerHeader;
