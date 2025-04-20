const Page = () => {
  return (
    <div className="md:grid md:grid-cols-2">
      {/* items */}
      <div className="border-border flex flex-col gap-4 p-8 max-md:border-b md:gap-8 md:border-r md:p-12">
        <h2 className="text-xl leading-snug font-medium md:text-3xl">
          Here we are
        </h2>

        <div className="relative h-full overflow-hidden rounded-3xl max-md:h-72"></div>
      </div>

      <div className="flex flex-col gap-4 p-8 md:gap-8 md:p-12">
        <h2 className="text-xl leading-snug font-medium md:text-3xl">
          Let us know
        </h2>

        {/* form */}
        <form action="" className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <ContactInput placeholder="Name" type="text" />
            <ContactInput placeholder="Email" type="email" />
          </div>

          <ContactInput placeholder="Message" type="textarea" />

          <button
            type="submit"
            className="bg-primary rounded-full px-4 py-5 leading-snug font-semibold text-white md:px-5 md:py-6"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Page;

type ContactInputProps = {
  placeholder?: string;
  type: "text" | "email" | "textarea";
};

const ContactInput = ({ type, placeholder }: ContactInputProps) => {
  const styles =
    "w-full rounded-3xl px-5 py-4 leading-snug placeholder:text-black placeholder:text-opacity-50 focus:outline-hidden md:px-6 md:py-5";

  return (
    <>
      {type === "textarea" ? (
        <textarea
          name=""
          id=""
          cols={30}
          rows={17}
          placeholder={placeholder}
          className={styles}
        />
      ) : (
        <input
          type={type}
          name=""
          id=""
          placeholder={placeholder}
          className={styles}
        />
      )}
    </>
  );
};
