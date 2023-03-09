import ArrowGoBackLineIcon from 'remixicon-react/ArrowGoBackLineIcon';
import RestartFillIcon from 'remixicon-react/RestartFillIcon';

export function ActionButtonS({ disabled = false, onClickUndo, onClickReset }: { disabled: boolean, onClickUndo: any, onClickReset: any }) {
  return (
    <div id="actionBar" style={{ display: "flex", gap: "1rem" }}>
      <button className='button'
        disabled={disabled}
        onClick={onClickUndo}
      >
        <ArrowGoBackLineIcon size={"14px"} />
        {" "}
        Undo
      </button>
      <button className='button'
        // disabled={disabled}
        onClick={onClickReset}
      >
        <RestartFillIcon size={"14px"} />
        {" "}
        Reset
      </button>
    </div>
  )
}