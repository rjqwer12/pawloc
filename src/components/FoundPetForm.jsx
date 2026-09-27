import LostPetForm from './LostPetForm';

export default function FoundPetForm(props) {
  return <LostPetForm {...props} category="found" />;
}
