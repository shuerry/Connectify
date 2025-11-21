import './index.css';
import TagView from './tag';
import useTagPage from '../../../hooks/useTagPage';
import AskQuestionButton from '../askQuestionButton';

/**
 * Represents the TagPage component which displays a list of tags
 * and provides functionality to handle tag clicks and ask a new question.
 */
const TagPage = () => {
  const { tlist, clickTag } = useTagPage();

  return (
    <>
      <div className='tags-header right_padding'>
        <div className='tags-header-left'>
          <h1 className='tags-title'>All Tags</h1>
          <p className='tags-subtitle'>{tlist.length} tags • Browse topics and technologies</p>
        </div>

        <div className='tags-header-right'>
          <AskQuestionButton />
        </div>
      </div>

      <div className='tag_list right_padding'>
        {tlist.map(t => (
          <TagView key={t.name} t={t} clickTag={clickTag} />
        ))}
      </div>
    </>
  );
};

export default TagPage;
