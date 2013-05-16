class ChangeDescriptionFromStringToText < ActiveRecord::Migration
  def up
    change_column :tours, :description, :text
  end

  def down
    change_column :tours, :description, :string
  end
end
