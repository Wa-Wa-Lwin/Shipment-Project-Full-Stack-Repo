import { useParams } from "react-router-dom";

const Logistics = () => {

  const { category } = useParams<{ category?: string }>();

  return (
    <div>
      <span>{category}</span>
    </div>
  )
}

export default Logistics