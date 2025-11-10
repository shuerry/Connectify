import { useState } from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import Form from '../baseComponents/form';
import Input from '../baseComponents/input';
import TextArea from '../baseComponents/textarea';
import './index.css';
import ProfanityFilterModal from './profanityFilterModal';
import filter from 'leo-profanity';

/**
 * NewQuestionPage component allows users to submit a new question with a title,
 * description, tags, and username.
 */
const NewQuestionPage = () => {
  const {
    title,
    setTitle,
    text,
    setText,
    tagNames,
    setTagNames,
    communityList,
    handleDropdownChange,
    titleErr,
    textErr,
    tagErr,
    postQuestion,
  } = useNewQuestion();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterReason, setFilterReason] = useState('');

  return (
    <Form>
      <Input
        title={'Question Title'}
        hint={'Limit title to 100 characters or less'}
        id={'formTitleInput'}
        val={title}
        setState={setTitle}
        err={titleErr}
      />
      <TextArea
        title={'Question Text'}
        hint={'Add details'}
        id={'formTextInput'}
        val={text}
        setState={setText}
        err={textErr}
      />
      <h5>
        <i>Markdown formatting is supported.</i>
      </h5>
      <Input
        title={'Tags'}
        hint={'Add keywords separated by whitespace'}
        id={'formTagInput'}
        val={tagNames}
        setState={setTagNames}
        err={tagErr}
      />
      <div className='input_title'>Community</div>
      <select className='form_communitySelect' onChange={handleDropdownChange}>
        <option value=''>Select Community</option>
        {communityList.map(com => (
          <option key={com._id.toString()} value={com._id.toString()}>
            {com.name}
          </option>
        ))}
      </select>
      <div className='btn_indicator_container'>
        <button
          className='form_postBtn'
          onClick={() => {
            const textToCheck = `${title} ${text} ${tagNames}`;
            const hits = filter.badWordsUsed(textToCheck);
            if (hits.length > 0) {
              setFilterReason(
                `Your post contains inappropriate language. Please remove: ${hits.join(', ')}`,
              );
              setIsFilterModalOpen(true);
              return;
            }
            postQuestion();
          }}>
          Post Question
        </button>
        <div className='mandatory_indicator'>* indicates mandatory fields</div>
      </div>
      {isFilterModalOpen && (
        <ProfanityFilterModal reason={filterReason} onClose={() => setIsFilterModalOpen(false)} />
      )}
    </Form>
  );
};

export default NewQuestionPage;
